import * as AWS from "aws-sdk";

const QUEUE_URL =
  "https://sqs.us-east-1.amazonaws.com/966390130392/figure-extract";
type ProgressStatus = "not_started" | "pending" | "done";

interface Paper {
  paper_id: string;
  paper_urls: string[];
  paper_images?: string[];
  status?: ProgressStatus;
}

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
        data.Messages.map(msg => {
          if (msg.Body) {
            try {
              const paper = JSON.parse(msg.Body) as Paper;
              console.log(paper);
            } catch (err) {
              console.error("ERROR OCCURRED to parse JSON message", err);
            }
          }

          if (msg.ReceiptHandle) {
            deleteMessage(msg.ReceiptHandle);
          }
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
