const DRIVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyNQSOvY0Yy7JSNtLZNOKXY_KM6kyoHdgbkg6TciqbYPMZemuLVJV-HB8P8NnjXrNe1/exec';

export async function uploadToDrive(file: File, folderName: string) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      
      const payload = {
        base64: base64,
        fileName: file.name,
        mimeType: file.type,
        folderName: folderName,
      };

      try {
        const response = await fetch(DRIVE_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
        });
        
        const result = await response.json();
        if (result.status === 'success') {
          resolve(result.url);
        } else {
          reject(new Error(result.message || 'Error en la subida a Drive'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}