import type { ID, NewOrder, Order, OrderStatus } from '@herafino/types';

export interface IOrderRepository {
  findById(id: ID): Promise<Order | null>;
  findByClientId(clientId: ID): Promise<Order[]>;
  findByCraftsmanId(craftsmanId: ID): Promise<Order[]>;
  findActiveByCraftsmanId(craftsmanId: ID): Promise<Order | null>;
  create(order: NewOrder): Promise<Order>;
  updateStatus(id: ID, status: OrderStatus): Promise<Order>;
  update(id: ID, data: Partial<Order>): Promise<Order>;
  cancel(id: ID, userId: ID): Promise<Order>;
}
