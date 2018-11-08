import * as request from "request";
import * as fs from "fs";

export async function downloadPDF(
  messageId: string,
  paperId: string,
  paperUrls: string[]
): Promise<string> {
  let pdfPath: string = "";

  for (const url of paperUrls) {
    try {
      await new Promise((resolve, reject) => {
        request(
          url,
          {
            timeout: 10000,
            encoding: "binary"
          },
          (err, res, body) => {
            if (err) {
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
      console.error("ERROR OCCURRED AT REQUEST URL LIST TO FIND PDF");
    }
  }

  return pdfPath;
}
