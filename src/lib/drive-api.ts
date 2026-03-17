/**
 * Servicio para interactuar con Google Drive a través de un Google Apps Script.
 */

const DRIVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyNQSOvY0Yy7JSNtLZNOKXY_KM6kyoHdgbkg6TciqbYPMZemuLVJV-HB8P8NnjXrNe1/exec';

export async function uploadToDrive(file: File, folderName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = (event.target?.result as string).split(',')[1];
        
        const payload = {
          base64: base64,
          fileName: file.name,
          mimeType: file.type,
          folderName: folderName,
        };

        const response = await fetch(DRIVE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Algunos scripts de Google requieren no-cors o manejar redirecciones
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
        });
        
        // Dado que usamos 'no-cors', no podemos leer la respuesta JSON directamente por seguridad del navegador
        // pero el archivo se subirá si el script está correctamente configurado.
        // Si el script retorna un JSON y necesitas la URL, asegúrate de que el script tenga CORS habilitado.
        resolve("Archivo enviado a proceso de subida");
      } catch (error) {
        console.error('Error en uploadToDrive:', error);
        reject(new Error('Error en la comunicación con el servicio de Drive.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
