import { gcp_zmis } from '../constants/catalog.js'

// Define types for the machine image data structure
interface RegionalImageIds {
  [key: string]: string | undefined
}

interface MachineImage {
  name: string
  regionalImageIds: RegionalImageIds
  type?: string | undefined
}

interface OSImage {
  os: string
  zmis: MachineImage[]
  type?: string | undefined
}

// Function to get GCP machine OS
export const getGmiOs = (regionCode: string, zmid: string): string | null => {
  try {
    if (!regionCode || !zmid || !gcp_zmis) {
      return null
    }

    const os: OSImage | undefined = gcp_zmis.find((os) => os.zmis.some((ami) => ami.regionalImageIds[regionCode] === zmid))

    if (os?.type) {
      return os.type
    }

    const ami = os?.zmis.find((ami) => ami.regionalImageIds[regionCode] === zmid)

    return ami?.type ?? null
  } catch (error) {
    console.warn('Error getting GMI type:', error)
    return null
  }
}
