// IndexedDB utility for storing audio files
const DB_NAME = "voxcribe_audio_db"
const STORE_NAME = "audio_files"
const DB_VERSION = 1

// Initialize IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

// Store audio file in IndexedDB
export const storeAudioFile = async (fileId: string, file: File): Promise<void> => {
  const db = await openDB()
  
  // Convert File to ArrayBuffer for storage
  const arrayBuffer = await file.arrayBuffer()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put({ 
      id: fileId, 
      data: arrayBuffer,
      type: file.type,
      name: file.name
    })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get audio file from IndexedDB
export const getAudioFile = async (fileId: string): Promise<File | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(fileId)

    request.onsuccess = () => {
      const result = request.result
      if (result && result.data) {
        // Convert ArrayBuffer back to File
        const blob = new Blob([result.data], { type: result.type || "audio/mpeg" })
        const file = new File([blob], result.name || "audio", { type: result.type || "audio/mpeg" })
        resolve(file)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// Delete audio file from IndexedDB
export const deleteAudioFile = async (fileId: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(fileId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
