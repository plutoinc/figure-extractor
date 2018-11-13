import * as request from "request";
import * as fs from "fs";

export interface PDFModel {
  pdfUrl: string;
  originUrl: string;
}

export interface PDF extends PDFModel {
  pdfLocalPath: string;
}

export async function downloadPDF(
  messageId: string,
  paperId: string,
  paperUrls: string[]
): Promise<PDF> {
  let pdfPath: string = "";
  let originUrl: string = "";

  for (const url of paperUrls) {
    try {
      await new Promise((resolve, reject) => {
        request(
          url,
          {
            timeout: 10000,
            encoding: "binary",
            maxRedirects: 9
          },
          (err, res, body) => {
            if (err) {
              console.log("HAD ERROR WHEN TRYING TO GET PDF FROM", url);
              console.error(err);
              reject(err);
            } else {
              const isPDF =
                res &&
                res.headers["content-type"]!.toLowerCase() ===
                  "application/pdf";

              if (isPDF) {
                const urlArray = url.split("/");
                const rawPdfFilename = `${paperId}-${
                  urlArray[urlArray.length - 1]
                }`;

                let pdfFilename = rawPdfFilename;
                if (!rawPdfFilename.endsWith(".pdf")) {
                  pdfFilename = rawPdfFilename + ".pdf";
                }

                if (!fs.existsSync(`${__dirname}/${messageId}`)) {
                  fs.mkdirSync(`${__dirname}/${messageId}`);
                }

                fs.writeFileSync(
                  `${__dirname}/${messageId}/${pdfFilename}`,
                  body,
                  {
                    encoding: "binary"
                  }
                );

                pdfPath = `${__dirname}/${messageId}/${pdfFilename}`;
                originUrl = url;
                resolve();
              } else {
                reject("Not PDF");
              }
            }
          }
        );
      });

      if (pdfPath && pdfPath.length > 0) {
        break;
      }
    } catch (err) {
      console.log(err);
      console.error("ERROR OCCURRED AT REQUEST URL LIST TO FIND PDF");
    }
  }

  return { pdfLocalPath: pdfPath, originUrl, pdfUrl: "" };
}
