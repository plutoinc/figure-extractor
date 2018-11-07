import * as request from "request";
import * as fs from "fs";
import { MessageBody } from "./";

export async function downloadPDF(
  messageId: string,
  messageBody: MessageBody
): Promise<string> {
  const urlList = messageBody.paper_urls;
  let pdfPath: string = "";

  for (const url of urlList) {
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
                const pdfFileName = `${messageBody.paper_id}-${
                  urlArray[urlArray.length - 1]
                }`;

                fs.mkdirSync(`${__dirname}/${messageId}`);

                fs.writeFileSync(
                  `${__dirname}/${messageId}/${pdfFileName}`,
                  body,
                  {
                    encoding: "binary"
                  }
                );

                pdfPath = `${__dirname}/${messageId}/${pdfFileName}`;
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
      console.error("error at try catch", err);
      console.log("NOT FOUND PDF");
      throw err;
    }
  }

  return pdfPath;
}
