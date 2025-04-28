import { Injectable } from '@nestjs/common'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { MenuItemsRepo } from './entities/menu-items.repo'
import { MenuItemsQuery } from './entities/menu-items.query'
import { CreateMenuItemsDto } from './dto/create-menu-items.dto'
import { MenuItemsEntity } from './entities/menu-items.entity'
import { UpdateStatusMenuItemsDto } from './dto/update-status-menu-items.dto'
import { UpdateMenuItemsDto } from './dto/update-menu-items.dto'
import { callGeminiAPI } from 'src/utils/gemini.api'
import { createWorker } from 'tesseract.js'
import { sendMessageToKafka } from 'src/utils/kafka'

@Injectable()
export class MenuItemsService {
  constructor(
    private readonly menuItemsRepo: MenuItemsRepo,
    private readonly menuItemsQuery: MenuItemsQuery,
  ) { }

  async createMenuItems(
    createMenuItemsDto: CreateMenuItemsDto,
    account: IAccount
  ): Promise<MenuItemsEntity> {
    try {
      const menu = await this.menuItemsRepo.createMenuItems({
        mitems_name: createMenuItemsDto.mitems_name,
        mitems_price: createMenuItemsDto.mitems_price,
        mitems_image: createMenuItemsDto.mitems_image,
        mitems_note: createMenuItemsDto.mitems_note,
        mitems_description: createMenuItemsDto.mitems_description,
        mitems_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${createMenuItemsDto.mitems_name} vừa được thêm mới`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return menu
    } catch (error) {
      saveLogSystem({
        action: 'createMenuItems',
        class: 'MenuItemsService',
        function: 'createMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(mitems_id: string, account: IAccount): Promise<MenuItemsEntity | null> {
    try {
      return this.menuItemsQuery.findOneById(mitems_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'MenuItemsService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateMenuItems(updateMenuItemsDto: UpdateMenuItemsDto, account: IAccount): Promise<UpdateResult> {
    try {
      const menuItemsExist = await this.menuItemsQuery.findOneById(updateMenuItemsDto.mitems_id, account)
      if (!menuItemsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const update = await this.menuItemsRepo.updateMenuItems({
        mitems_name: updateMenuItemsDto.mitems_name,
        mitems_price: updateMenuItemsDto.mitems_price,
        mitems_image: updateMenuItemsDto.mitems_image,
        mitems_note: updateMenuItemsDto.mitems_note,
        mitems_description: updateMenuItemsDto.mitems_description,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        mitems_res_id: account.account_restaurant_id,
        mitems_id: updateMenuItemsDto.mitems_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${updateMenuItemsDto.mitems_name} vừa được cập nhật`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateMenuItems',
        class: 'MenuItemsService',
        function: 'updateMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteMenuItems(mitems_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const menuItemsExist = await this.menuItemsQuery.findOneById(mitems_id, account)
      if (!menuItemsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const deleted = await this.menuItemsRepo.deleteMenuItems(mitems_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${menuItemsExist.mitems_name} vừa được xóa`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return deleted
    } catch (error) {
      saveLogSystem({
        action: 'deleteMenuItems',
        class: 'MenuItemsService',
        function: 'deleteMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreMenuItems(mitems_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const menuItemsExist = await this.menuItemsQuery.findOneById(mitems_id, account)
      if (!menuItemsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const restore = await this.menuItemsRepo.restoreMenuItems(mitems_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${menuItemsExist.mitems_name} vừa được khôi phục`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return restore
    } catch (error) {
      saveLogSystem({
        action: 'restoreMenuItems',
        class: 'MenuItemsService',
        function: 'restoreMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusMenuItems(
    updateStatusMenuItemsDto: UpdateStatusMenuItemsDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const menuItemsExist = await this.menuItemsQuery.findOneById(
        updateStatusMenuItemsDto.mitems_id,
        account
      )
      if (!menuItemsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const update = await this.menuItemsRepo.updateStatusMenuItems(updateStatusMenuItemsDto, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Món ăn ${menuItemsExist.mitems_name} vừa được cập nhật trạng thái`,
          noti_title: `Món ăn`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusMenuItems',
        class: 'MenuItemsService',
        function: 'updateStatusMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    {
      pageSize,
      pageIndex,
      mitems_name
    }: {
      pageSize: number
      pageIndex: number
      mitems_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<MenuItemsEntity>> {
    try {
      if (!mitems_name && typeof mitems_name !== 'string') {
        throw new BadRequestError('Menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataMenuItems = await this.menuItemsQuery.findAllPagination(
        { pageSize, pageIndex, mitems_name, isDeleted: 0 },
        account
      )

      return dataMenuItems
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'MenuItemsService',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllRecycle(
    {
      pageSize,
      pageIndex,
      mitems_name
    }: {
      pageSize: number
      pageIndex: number
      mitems_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<MenuItemsEntity>> {
    try {
      if (!mitems_name && typeof mitems_name !== 'string') {
        throw new BadRequestError('Menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataMenuItems = await this.menuItemsQuery.findAllPagination(
        { pageSize, pageIndex, mitems_name, isDeleted: 1 },
        account
      )

      return dataMenuItems
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'MenuItemsService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllItemsName(account: IAccount): Promise<MenuItemsEntity[]> {
    try {
      return this.menuItemsQuery.findAllItemsName(account)
    } catch (error) {
      saveLogSystem({
        action: 'findAllCatName',
        class: 'MenuItemsService',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async extractMenuFromImage(imageBuffer: Buffer): Promise<{
    mitems_name: string
    mitems_price: number
    mitems_note: string
    mitems_description: string
  }[]> {
    const worker = await createWorker('eng+vie'); // Support both English and Vietnamese
    try {
      const { data: { text } } = await worker.recognize(imageBuffer);

      const prompt = `
Below is raw text extracted from a restaurant menu image via OCR, which may contain spelling errors or extra characters. Analyze and convert it into JSON format according to the following requirements:

1. Data normalization:
   - Dish name: Fix Vietnamese spelling errors (e.g., "mudng" to "muống", "nom" to "nộm"), capitalize the first letter of each word, remove extra characters like "wi", "wit", "&".
   - Price: Normalize to an integer (e.g., "50000" to 50000, "50,000 VND" to 50000). If unclear, set to null.
   - Description: If there's no clear information or only stray characters (e.g., "wi", "wd"), set to null. If meaning can be inferred, keep it concise.

2. JSON format:
   - Return an array of objects with the fields:
     - "name" (dish name, string),
     - "price" (price, number or null),
     - "description" (description, string or null).

3. Return only JSON, no explanations or markdown symbols.

Raw text:
${text}
    `;

      const menuData = await callGeminiAPI(prompt);

      if (!menuData) {
        await worker.terminate();
        return [];
      }

      let cleanedText = menuData
        .replace(/```json|```/g, '')
        .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '')
        .trim();

      let parsedData;
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (parseError) {
        await worker.terminate();
        return [];
      }

      if (!Array.isArray(parsedData)) {
        console.error('❌ Returned data is not an array:', parsedData);
        await worker.terminate();
        return [];
      }

      const result: {
        mitems_name: string
        mitems_price: number
        mitems_note: string
        mitems_description: string
      }[] = parsedData.map((item: any) => ({
        mitems_name: typeof item.name === 'string' ? item.name : '',
        mitems_price: typeof item.price === 'number' ? item.price : 0,
        mitems_note: typeof item.description === 'string' ? item.description : '',
        mitems_description: typeof item.description === 'string' ? item.description : '',
      }));

      await worker.terminate();
      return result;
    } catch (error) {
      await worker.terminate();
      saveLogSystem({
        action: 'extractMenuFromImage',
        class: 'DishesService',
        function: 'extractMenuFromImage',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      });
      throw new ServerErrorDefault(error);
    }
  }

  async findAllMenuItemsByResId({ mitems_res_id }: { mitems_res_id: string }): Promise<MenuItemsEntity[]> {
    try {
      return this.menuItemsQuery.getMenuItemsByRestaurantId({ mitems_res_id })
    } catch (error) {
      saveLogSystem({
        action: 'findAllMenuItemsByResId',
        class: 'MenuItemsService',
        function: 'findAllMenuItemsByResId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

}
