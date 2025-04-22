import { getElasticsearch } from 'src/config/elasticsearch.config'
import { IAccount } from 'src/guard/interface/account.interface'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { MENU_CATEGORY_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'
import { MenuCategoryEntity } from './menu-category.entity'

@Injectable()
export class MenuCategoryQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(mcat_id: string, account: IAccount): Promise<MenuCategoryEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(MENU_CATEGORY_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: MENU_CATEGORY_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    mcat_id: {
                      query: mcat_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    mcat_res_id: {
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
        class: 'MenuCategoryQuery',
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
      mcat_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { mcat_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<MenuCategoryEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(MENU_CATEGORY_ELASTICSEARCH_INDEX)

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

      if (mcat_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            mcat_name: {
              query: mcat_name,
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
            mcat_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: MENU_CATEGORY_ELASTICSEARCH_INDEX,
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
      const results = hits.map((hit) => hit._source)

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
        class: 'MenuCategoryQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllCatName(account: IAccount): Promise<MenuCategoryEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(MENU_CATEGORY_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: MENU_CATEGORY_ELASTICSEARCH_INDEX,
        body: {
          _source: ['mcat_id', 'mcat_name'],
          query: {
            bool: {
              must: [
                {
                  match: {
                    mcat_res_id: {
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
                    mcat_status: {
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
        action: 'findAllCatName',
        class: 'MenuCategoryQuery',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
