import * as AWS from "aws-sdk";
import { downloadPDF } from "./downloadPdf";
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

              await downloadPDF(msg.MessageId, message);

              if (msg.ReceiptHandle) {
                deleteMessage(msg.ReceiptHandle);
              }
            } catch (err) {
              console.error("ERROR OCCURRED to parse JSON message", err);
            }
          }
        });

        Promise.all(processes).then(() => {
          console.log("DONE");
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
