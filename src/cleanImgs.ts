import * as fs from "fs";
import * as gm from "gm";
const magick = gm.subClass({ imageMagick: true });

export async function cleanSmallByteImages(
  imgFiles: string[],
  tmpDirPath: string
) {
  for (const imgFile of imgFiles) {
    await new Promise((resolve, reject) => {
      magick(`${tmpDirPath}/${imgFile}`).filesize((err, value) => {
        if (err) {
          reject(err);
        } else {
          console.log(imgFile, value);
          if (!isNaN(parseInt(value[value.length - 2], 10))) {
            // Byte
            fs.unlinkSync(`${tmpDirPath}/${imgFile}`);
          }
          resolve(value);
        }
      });
    });
  }
}
