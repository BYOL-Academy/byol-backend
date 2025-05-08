import { env } from '@/utils'

export const databaseConfiguration: any = {
  type: env!.databaseType as any,
  url: `${
    env.databseDeploymentMode === 'on_premise'
      ? `mongodb://${env.databaseUsername}:${env.databasePassword}@${env.databaseHost}:${env.databasePort}`
      : `mongodb+srv://${env.databaseUsername}:${encodeURIComponent(env.databasePassword!)}@${env.databaseHost}`
  }/${env.databaseName}`,
  synchronize: env.nodeEnvironment === 'development', // Only enable in development
  logging: env.databaseLogging,
  entities: ['src/database/models/*.model.ts'],
  migrations: ['src/database/migrations/*.ts'],
}
