import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  Headers,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExcelService } from './excel.service';
import { UploadFileService } from './upload-file.service';
import { BillService } from './bill.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/users.entity';

@Controller('excel')
@UseGuards(JwtAuthGuard)
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly uploadFileService: UploadFileService,
    private readonly billService: BillService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls', '.csv', '.zip'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('不支持的文件类型，仅支持Excel、CSV和ZIP文件'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Req() req: any,
    @Headers('content-type') contentType: string,
    @Headers('content-disposition') contentDisposition: string,
    @GetCurrentUser() user: User,
  ) {
    try {
      // 处理Binary格式上传
      if (
        !file &&
        contentType &&
        !contentType.includes('multipart/form-data')
      ) {
        file = await this.uploadFileService.handleBinaryUpload(
          req,
          contentType,
          contentDisposition,
        );
      }

      // 检查文件是否存在
      this.uploadFileService.validateFileExists(file);

      // 处理账单文件
      const { parsedData, categorizedData, exportResult } =
        await this.billService.processBillFile(
          file.path,
          file.originalname,
          user.id,
        );

      // 返回成功响应
      return {
        fileName: file.originalname,
        fileSize: file.size,
        totalRows: parsedData.totalRows,
        parseTime: parsedData.parseTime,
        importedCount: exportResult.importedCount,
        categorizedCounts: {
          income: categorizedData.income.length,
          expense: categorizedData.expense.length,
          neutral: categorizedData.neutral.length,
        },
      };
    } catch (error) {
      // 返回错误响应
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
