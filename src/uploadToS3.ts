import * as AWS from "aws-sdk";
import * as fs from "fs";

const BUCKET = "scinapse-pdf-extract";
const s3 = new AWS.S3();

export async function uploadFolder(folderPath: string, prefix: string) {
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
          Key: `${prefix}/${filename}`,
          Body: fileStream
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

  await Promise.all(promises).then(res => {
    console.log("PROMISES", res);
    console.log("PROMISES %j", res);
    console.log("SUCCESS TO UPLOAD ALL FILES IN FOLDER");
  });
}
