import { getElasticsearch } from 'src/config/elasticsearch.config'
import { IAccount } from 'src/guard/interface/account.interface'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'
import { MenuItemsEntity } from './menu-items.entity'
import { MENU_CATEGORY_ELASTICSEARCH_INDEX, MENU_ITEMS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'

@Injectable()
export class MenuItemsQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(mitems_id: string, account: IAccount): Promise<MenuItemsEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(MENU_ITEMS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: MENU_ITEMS_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    mitems_id: {
                      query: mitems_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    mitems_res_id: {
                      query: account.account_restaurant_id,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })
      return result.hits?.hits[0]?._source || null
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'MenuItemsQuery',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllPagination(
    {
      mitems_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { mitems_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<MenuItemsEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(MENU_ITEMS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return {
          meta: {
            current: pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

      const from = (pageIndex - 1) * pageSize
      const query: any = {
        bool: {
          must: []
        }
      }

      if (mitems_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            mitems_name: {
              query: mitems_name,
              operator: 'and'
            }
          }
        })
      }

      query.bool.must.push(
        {
          match: {
            isDeleted: {
              query: isDeleted,
              operator: 'and'
            }
          }
        },
        {
          match: {
            mitems_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: MENU_ITEMS_ELASTICSEARCH_INDEX,
        body: {
          query,
          from,
          size: pageSize,
          sort: [{ updatedAt: { order: 'desc' } }]
        }
      })
      const hits = result.hits?.hits || []
      let totalRecords = 0
      if (typeof result.hits?.total === 'object') {
        totalRecords = result.hits.total.value
      } else if (typeof result.hits?.total === 'number') {
        totalRecords = result.hits.total
      }
      const totalPages = Math.ceil(totalRecords / pageSize)
      const results = hits.map((hit) => hit._source) as MenuItemsEntity[]


      return {
        meta: {
          current: pageIndex,
          pageSize,
          totalPage: totalPages,
          totalItem: totalRecords
        },
        result: results
      }
    } catch (error) {
      saveLogSystem({
        action: 'findAllPagination',
        class: 'MenuItemsQuery',
        function: 'findAllPagination',
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
      const indexExist = await indexElasticsearchExists(MENU_ITEMS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: MENU_ITEMS_ELASTICSEARCH_INDEX,
        body: {
          _source: ['mitems_id', 'mitems_name'],
          query: {
            bool: {
              must: [
                {
                  match: {
                    mitems_res_id: {
                      query: account.account_restaurant_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    isDeleted: {
                      query: 0,
                      operator: 'and'
                    }
                  }
                },
                //status
                {
                  match: {
                    mitems_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findAllItemsName',
        class: 'MenuItemsQuery',
        function: 'findAllItemsName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
