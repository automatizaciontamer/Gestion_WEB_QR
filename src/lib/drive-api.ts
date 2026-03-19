/**
 * Servicio para interactuar con Google Drive a través de un Google Apps Script.
 * v3.5 - Nueva URL de Script, soporte para descarga directa y manejo de errores robusto.
 */

const DRIVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyNQSOvY0Yy7JSNtLZNOKXY_KM6kyoHdgbkg6TciqbYPMZemuLVJV-HB8P8NnjXrNe1/exec';

export async function uploadToDrive(file: File, folderName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = (event.target?.result as string).split(',')[1];
        
        const payload = {
          action: 'upload',
          base64: base64,
          fileName: file.name,
          mimeType: file.type,
          folderName: folderName,
        };

        // Enviamos como texto plano para evitar problemas de preflight CORS con Apps Script
        const response = await fetch(DRIVE_SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'success') {
          resolve(data);
        } else {
          console.error('Error reportado por el script:', data.message);
          resolve({ status: 'error', message: data.message });
        }
      } catch (error: any) {
        console.error('Error en la comunicación con Drive API:', error);
        resolve({ status: 'error', message: error.message });
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Elimina una CARPETA completa de Google Drive buscando por su nombre único.
 */
export async function deleteFolderFromDrive(folderName: string): Promise<any> {
  if (!folderName) return { status: 'ignored' };
  
  try {
    const payload = {
      action: 'deleteFolder',
      folderName: folderName,
    };

    const response = await fetch(DRIVE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return await response.json();
  } catch (error) {
    console.warn('Error eliminando carpeta de Drive:', error);
    return { status: 'failed' };
  }
}

/**
 * Elimina un archivo individual de Google Drive por su ID.
 */
export async function deleteFromDrive(fileId: string): Promise<any> {
  if (!fileId) return { status: 'ignored' };
  
  try {
    const payload = {
      action: 'delete',
      fileId: fileId,
    };

    const response = await fetch(DRIVE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return await response.json();
  } catch (error) {
    console.warn('Error eliminando archivo de Drive:', error);
    return { status: 'failed' };
  }
}
