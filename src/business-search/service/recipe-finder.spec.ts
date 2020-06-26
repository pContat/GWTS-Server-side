import { Test } from '@nestjs/testing';
import { InvoiceCreationService } from './invoice-creation.service';
import { CurrencyModule } from '../../currency/currency.module';
import { BuyingModule } from '../../buying/buying.module';
import { SellingModule } from '../../selling/selling.module';
import { InvoiceModule } from '../crud/invoice.module';
import { InvoiceCreationDao } from './invoice-creation-dao.service';
import { InvoiceModel } from '../crud/invoice.model';
import { transaction } from 'objection';
import { CoreModule } from '../../../core/core.module';
import { InvoiceType } from '../type/type';

describe('Invoice creation service', () => {
  let invoiceCreationService: InvoiceCreationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [InvoiceCreationService, InvoiceCreationDao],
      imports: [CurrencyModule, BuyingModule, SellingModule, InvoiceModule, CoreModule]
    }).compile();

    invoiceCreationService = moduleRef.get<InvoiceCreationService>(InvoiceCreationService);
  });

  describe('credit note', () => {
    const deliverySlip = 198;
    it('create', async () => {
      /*jest
        .spyOn(invoiceCreationService, 'createCreditNoteInvoice')
        .mockImplementation(() => Promise.resolve(new Invoice()));*/

      const trx = await InvoiceModel.startTransaction();

      const creditNoteInput = {
        salesItem: [
          {
            sellingItemId: 552, //557,558
            unitPrice: 1,
            numberOfBox: 1
          },
          {
            sellingItemId: 557, //557,558
            unitPrice: 2,
            numberOfBox: 1
          }
        ],
        deliverySlip
      };

      try {
        const result = await invoiceCreationService.createCreditNoteInvoice(creditNoteInput, trx);
        expect(result.bookedAmount).toEqual(3);
        expect(result.invoiceType).toEqual(InvoiceType.SALE_CREDIT_NOTE);
        expect(result.payedAmount).toEqual(0);
        expect(result.creditNoteSellingItems.length).toEqual(2);
        await trx.commit();
      } catch (e) {
        await trx.rollback();
        fail(e);
      }
    });

    it('already exist', async () => {
      const trx = await InvoiceModel.startTransaction();
      const creditNoteInput = {
        salesItem: [
          {
            sellingItemId: 1,
            unitPrice: 1,
            numberOfBox: 1
          }
        ],
        deliverySlip
      };
      try {
        const result = await invoiceCreationService.createCreditNoteInvoice(creditNoteInput, trx);
        await trx.rollback();
        fail('Should have throw');
      } catch (e) {
        expect(e.message.includes('already generated')).toBeTruthy();
      }
    });

    it('remove', async () => {
      const trx = await InvoiceModel.startTransaction();
      try {
        const result = await invoiceCreationService.cancelCreditNoteInvoice(deliverySlip, trx);
        expect(result.creditNoteSellingItems.length).toEqual(0);
        await trx.commit();
      } catch (e) {
        await trx.rollback();
        fail(e);
      }
    });

    it('remove non existing', async () => {
      const trx = await InvoiceModel.startTransaction();
      try {
        const result = await invoiceCreationService.cancelCreditNoteInvoice(deliverySlip, trx);
        await trx.rollback();
        fail('Should have throw');
      } catch (e) {
        expect(e.message.includes('creditNote do not exist')).toBeTruthy();
      }
    });
  });
});
