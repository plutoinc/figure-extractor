import * as AWS from "aws-sdk";
import * as path from "path";
import { downloadPDF } from "./downloadPdf";
import { extractImgs } from "./extractImgs";
import { getImgFileNames } from "./getImgFilenames";
import { cleanSmallByteImages } from "./cleanImgs";
import { uploadFolder } from "./uploadToS3";

// type ProgressStatus = "not_started" | "pending" | "done";

export interface MessageBody {
  paper_id: string;
  paper_urls: string[];
}

// interface Paper {
//   paperId: string;
//   paperUrls: string[];
//   paperImages: string[];
//   status: ProgressStatus;
// }

const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/966390130392/figure-extract";

const sqs = new AWS.SQS({
  region: "us-east-1"
});

const params = {
  QueueUrl: QUEUE_URL
};

setInterval(() => {
  sqs.receiveMessage(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      return;
    } else {
      if (data.Messages && data.Messages.length > 0) {
        const processes = data.Messages.map(async msg => {
          if (msg.Body && msg.MessageId) {
            console.log(msg.Body);
            try {
              const message = JSON.parse(msg.Body) as MessageBody;

              const pdfPath = await downloadPDF(msg.MessageId, message);
              await extractImgs(pdfPath);
              const dirForPdfImg = path.resolve(pdfPath, "../");
              const imgFilenames = getImgFileNames(dirForPdfImg);

              if (imgFilenames && imgFilenames.length > 0) {
                cleanSmallByteImages(imgFilenames, dirForPdfImg);
                await uploadFolder(dirForPdfImg, message.paper_id);
              }
            } catch (err) {
              console.error("ERROR OCCURRED to parse JSON message", err);
            }

            // TODO: Change the position of the below logic
            if (msg.ReceiptHandle) {
              deleteMessage(msg.ReceiptHandle);
            }
          }
        });

        Promise.all(processes)
          .then(() => {
            console.log("DONE");
          })
          .catch(err => {
            console.error(err);
          });
      }
    }
  });
}, 1000);

function deleteMessage(receiptHandle: string) {
  const params = {
    QueueUrl: QUEUE_URL,
    ReceiptHandle: receiptHandle
  };

  sqs.deleteMessage(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else console.log(data);
  });
}
