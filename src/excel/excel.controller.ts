import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  Headers,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileService } from './upload-file.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetCurrentUser } from '../auth/get-current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/users.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExcelEventTypes, FileUploadedEvent, type FileMetadata } from './events/excel-events';

@Controller('excel')
@UseGuards(JwtAuthGuard)
export class ExcelController {
  constructor(
    private readonly uploadFileService: UploadFileService,
    private readonly eventEmitter: EventEmitter2,
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
    @UploadedFile() file: FileMetadata,
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

      // 发布文件上传事件
      const fileUploadedEvent: FileUploadedEvent = {
        file,
        userId: user.id,
        originalname: file.originalname,
        filePath: file.path,
      };

      this.eventEmitter.emit(ExcelEventTypes.FILE_UPLOADED, fileUploadedEvent);

      // 返回成功响应
      return {
        fileName: file.originalname,
        fileSize: file.size,
        message: '文件上传成功，正在处理中',
      };
    } catch (error) {
      // 返回错误响应
      throw new HttpException(
        {
          status: 'error',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
