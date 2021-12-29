import * as Objection from 'objection';

export interface ObjectionQueryOption extends ObjectionTransactionQuery {
  relationExpression?: string;
}

export interface ObjectionTransactionQuery {
  transaction?: Objection.Transaction;
}
