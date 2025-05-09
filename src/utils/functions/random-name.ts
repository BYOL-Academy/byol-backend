import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator'

export const randomName = (
  length: number = 2,
  dictionaries: string[][] = [adjectives, animals],
  separator: string = ' ',
  style: 'capital' | 'lowerCase' | 'upperCase' = 'capital',
): string => {
  return uniqueNamesGenerator({
    dictionaries,
    separator,
    length,
    style,
  })
}
