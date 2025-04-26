import { getElasticsearch } from 'src/config/elasticsearch.config'
import { IAccount } from 'src/guard/interface/account.interface'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'
import { AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { AmenitiesEntity } from './amenities.entity'

@Injectable()
export class AmenitiesQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(ame_id: string, account: IAccount): Promise<AmenitiesEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    ame_id: {
                      query: ame_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    ame_res_id: {
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
        class: 'AmenitiesQuery',
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
      ame_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { ame_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<AmenitiesEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX)

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

      if (ame_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            ame_name: {
              query: ame_name,
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
            ame_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX,
        body: {
          query,
          from,
          size: pageSize,
          sort: [{ updatedAt: { order: 'asc' } }]
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
        class: 'AmenitiesQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllAmenitiesName(account: IAccount): Promise<AmenitiesEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX,
        body: {
          _source: ["ame_name", "ame_price", "ame_note", "ame_id", "ame_description", "ame_res_id"],
          query: {
            bool: {
              must: [
                {
                  match: {
                    ame_res_id: {
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
                    ame_status: {
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
        class: 'AmenitiesQuery',
        function: 'findAllItemsName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getAmenitiesByRestaurantId({ ame_res_id }: { ame_res_id: string }): Promise<AmenitiesEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX,
        _source: ["ame_name", "ame_price", "ame_note", "ame_id", "ame_description", "ame_res_id"],
        body: {
          size: 1000,
          query: {
            bool: {
              must: [
                {
                  match: {
                    ame_res_id: {
                      query: ame_res_id,
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
                {
                  match: {
                    ame_status: {
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
        action: 'getAmenitiesByRestaurantId',
        class: 'AmenitiesQuery',
        function: 'getAmenitiesByRestaurantId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
