import * as AWS from "aws-sdk";
import * as fs from "fs";
import { ManagedUpload } from "aws-sdk/clients/s3";

const BUCKET = "scinapse-pdf-extract";
const s3 = new AWS.S3();

export async function uploadFolder(
  folderPath: string,
  prefix: string
): Promise<string[]> {
  // prefix should be an id of the Paper
  const filenames = fs.readdirSync(folderPath);

  const promises = filenames.map(async filename => {
    return await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(`${folderPath}/${filename}`);

      fileStream.on("error", err => {
        if (err) {
          reject(err);
        }
      });

      fileStream.on("open", async () => {
        const params = {
          Bucket: BUCKET,
          Key: `${prefix}/${encodeURIComponent(filename)}`,
          Body: fileStream,
          ACL: "public-read"
        };

        try {
          const data = await s3.upload(params).promise();
          resolve(data);
        } catch (err) {
          console.error("Has error to upload file to s3", err);
          reject(err);
        }
      });
    });
  });

  return await Promise.all(promises)
    .then((results: ManagedUpload.SendData[]) => {
      const keys = results.map(res => res.Key);
      return keys;
    })
    .catch(err => {
      console.error("ERROR OCCURRED AT UPLOADING FOLDER TO S3");
      throw err;
    });
}
