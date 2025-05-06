import { env } from '@/utils'
import { DataSourceOptions } from 'typeorm'

export const databaseConfiguration: DataSourceOptions = {
  type: env!.databaseType as any,
  url: `mongodb://${env.databaseUsername}:${env.databasePassword}@${env.databaseHost}${env.databseDeploymentMode === 'on_premise' ? `:${env.databasePort}` : ''}/${
    env.databaseName
  }`,
  synchronize: env.nodeEnvironment === 'development', // Only enable in development
  logging: env.databaseLogging,
  entities: ['src/database/models/*.model.ts'],
  migrations: ['src/database/migrations/*.ts'],
}
