import * as AWS from "aws-sdk";
import * as fs from "fs";

const BUCKET = "scinapse-pdf-extract";
const s3 = new AWS.S3();

export async function uploadFolder(folderPath: string, prefix: string) {
  // prefix should be an id of the Paper
  const filenames = fs.readdirSync(folderPath);

  const promises = filenames.map(async filename => {
    const fileStream = fs.createReadStream(`${folderPath}/${filename}`);

    fileStream.on("error", err => {
      if (err) {
        throw err;
      }
    });

    fileStream.on("open", () => {
      const params = {
        Bucket: BUCKET,
        Key: `${prefix}/${filename}`,
        Body: fileStream
      };

      try {
        s3.upload(params).promise();
      } catch (err) {
        console.error("Has error to upload file to s3", err);
        throw err;
      }
    });
  });

  await Promise.all(promises).then(() => {
    console.log("SUCCESS TO UPLOAD ALL FILES IN FOLDER");
  });
}
