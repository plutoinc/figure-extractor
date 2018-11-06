import * as AWS from "aws-sdk";

const sqs = new AWS.SQS();

const params = {
  QueueUrl: "https://sqs.us-east-1.amazonaws.com/966390130392/figure-extract"
};

setInterval(() => {
  sqs.receiveMessage(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      return;
    } else {
      if (data.Messages && data.Messages.length > 0) {
        data.Messages.map(msg => {
          console.log(msg);
        });
      }
    }
  });
}, 1000);
