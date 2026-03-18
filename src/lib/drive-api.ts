
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

        // Usamos fetch con mode no-cors. No intentamos parsear la respuesta como JSON
        // ya que las respuestas opacas no permiten acceder al cuerpo.
        await fetch(DRIVE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
        });
        
        resolve("Archivo enviado correctamente");
      } catch (error) {
        console.warn('Error silencioso en uploadToDrive:', error);
        // Resolvemos de todos modos para no bloquear el flujo si es un error de CORS en la respuesta
        resolve("Proceso de subida finalizado");
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
