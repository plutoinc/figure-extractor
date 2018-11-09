import * as dynamoose from "dynamoose";
import { Paper } from ".";
import { PDFModel } from "./downloadPdf";

const TABLE_NAME = "paper-pdf-images";

const Schema = dynamoose.Schema;
const paperSchema = new Schema({
  paper_id: {
    type: String,
    hashKey: true
  },
  paper_urls: {
    type: [String]
  },
  paper_pdf: {
    type: Object
  },
  paper_images: {
    type: [String]
  },
  process_status: {
    type: String
  }
});
const PaperModel = dynamoose.model<
  {
    paper_id: string;
    paper_urls?: string[];
    paper_pdf?: PDFModel;
    paper_images?: string[];
    process_status: string;
  },
  {}
>(TABLE_NAME, paperSchema);

class DynamoDBManager {
  async getPaperItem(paperId: string) {
    try {
      const data = await PaperModel.get(paperId);

      if (data) {
        return data;
      }

      return null;
    } catch (err) {
      console.error("ERROR OCCURRED AT GET DYNAMO_DB ITEM");
      throw new Error(err);
    }
  }

  async updateDynamoDB(paper: Paper) {
    try {
      await PaperModel.update(
        { paper_id: paper.paperId },
        {
          paper_pdf: paper.paperPdf,
          process_status: paper.processStatus,
          paper_images: paper.paperImages
        }
      );
    } catch (err) {
      console.error("ERROR OCCURRED AT UPDATE DYNAMO_DB ITEM");
      throw new Error(err);
    }
  }
}

const dynamoDBManger = new DynamoDBManager();

export default dynamoDBManger;
