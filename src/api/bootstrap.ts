import type { Schema, AssetListElement } from '@/api/types/schema';
import type { TransactionListElement } from '@/api/types/transaction';
import type { DataTypeMap } from '@/api/types/dataType';
import { useConfigStore } from '@/store/configStore';

function getClient() {
  return useConfigStore.getState().client;
}

export async function getHeader(): Promise<Schema> {
  const res = await getClient().post<Schema>('/api/query/getHeader/');
  return res.data;
}

export async function getSchema(): Promise<AssetListElement[]> {
  const res = await getClient().post<AssetListElement[]>('/api/query/getSchema/');
  return res.data;
}

export async function getTx(): Promise<TransactionListElement[]> {
  const res = await getClient().post<TransactionListElement[]>('/api/query/getTx/');
  return res.data;
}

export async function getDataTypes(): Promise<DataTypeMap> {
  const res = await getClient().post<DataTypeMap>('/api/query/getDataTypes/');
  return res.data;
}
