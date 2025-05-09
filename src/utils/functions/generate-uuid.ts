import { v4 as uuidv4 } from 'uuid'

export const generate_customUUID = (length: number = 8): string => {
  return uuidv4().substring(0, length)
}
