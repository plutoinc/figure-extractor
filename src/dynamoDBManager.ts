import * as AWS from "aws-sdk";
import { Paper } from ".";
import { PutItemInputAttributeMap } from "aws-sdk/clients/dynamodb";

const dynamodb = new AWS.DynamoDB({
  region: "us-east-1"
});
const TABLE_NAME = "paper-pdf-images";

interface DynamoDBPaperGetParams extends PutItemInputAttributeMap {
  paper_id: {
    S: string;
  };
}

class DynamoDBManager {
  async getPaperItem(paperId: string) {
    const key: DynamoDBPaperGetParams = {
      paper_id: {
        S: paperId
      }
    };
    const params = {
      Key: key,
      TableName: TABLE_NAME
    };

    try {
      const data = await dynamodb.getItem(params).promise();
      if (data.Item) {
        console.log(data.Item);

        return data.Item;
      }
      return null;
    } catch (err) {
      console.error("ERROR OCCURRED AT GET DYNAMO_DB ITEM");
      throw new Error(err);
    }
  }

  async updateDynamoDB(paper: Paper) {
    const params: AWS.DynamoDB.Types.UpdateItemInput = {
      TableName: TABLE_NAME,
      Key: {
        paper_id: { S: paper.paperId }
      },
      UpdateExpression: "set paper_images=:i, paper_pdf=:p, process_status=:s",
      ExpressionAttributeValues: {
        ":i": { SS: paper.paperImages || [] },
        ":p": { S: paper.paperPdf || "null" },
        ":s": { S: paper.processStatus }
      }
    };

    try {
      await dynamodb.updateItem(params).promise();
    } catch (err) {
      console.error("ERROR OCCURRED AT UPDATE DYNAMO_DB ITEM");
      throw new Error(err);
    }
  }
}

const dynamoDBManger = new DynamoDBManager();

export default dynamoDBManger;
