import { Module, Global } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { UploadFileService } from './upload-file.service';
import { BillService } from './bill.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Global()
@Module({
  imports: [TransactionsModule],
  controllers: [ExcelController],
  providers: [ExcelService, UploadFileService, BillService],
  exports: [ExcelService, UploadFileService, BillService],
})
export class ExcelModule {}
