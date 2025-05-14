export enum ByolRole {
  Admin = 'Admin',
  Member = 'Member',
}

export type Role = ByolRole | 'Admin' | 'Member'
export type PlanProps = 'Basic' | 'Premium'
export const plans: readonly PlanProps[] = ['Basic', 'Premium']

export {}
