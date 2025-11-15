import { env } from '../../lib/env';

const queue: string[] = [];

export async function enqueueAnalysis(id: string): Promise<boolean> {
  if (!env.sqsQueueUrl) return false;
  queue.push(id);
  return true;
}

export function _peekQueue() {
  return [...queue];
}
