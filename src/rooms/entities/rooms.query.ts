import { getElasticsearch } from 'src/config/elasticsearch.config'
import { IAccount } from 'src/guard/interface/account.interface'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ROOMS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'
import { RoomsEntity } from './rooms.entity'

@Injectable()
export class RoomsQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(room_id: string, account: IAccount): Promise<RoomsEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(ROOMS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: ROOMS_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    room_id: {
                      query: room_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    room_res_id: {
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
        class: 'RoomsQuery',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneInforById(room_id: string): Promise<RoomsEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(ROOMS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: ROOMS_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    room_id: {
                      query: room_id,
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
                    room_status: {
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

      return result.hits?.hits[0]?._source || null
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'RoomsQuery',
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
      room_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { room_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<RoomsEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(ROOMS_ELASTICSEARCH_INDEX)

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

      if (room_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            room_name: {
              query: room_name,
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
            room_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: ROOMS_ELASTICSEARCH_INDEX,
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
        class: 'RoomsQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllRoomName(account: IAccount): Promise<RoomsEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(ROOMS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: ROOMS_ELASTICSEARCH_INDEX,
        body: {
          _source: ['room_id', 'room_name'],
          query: {
            bool: {
              must: [
                {
                  match: {
                    room_res_id: {
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
                    room_status: {
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
        action: 'findAllRoomName',
        class: 'RoomsQuery',
        function: 'findAllRoomName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getRoomByRestaurantId({ room_res_id }: { room_res_id: string }): Promise<RoomsEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(ROOMS_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      //isDeleted = 0
      //status = enable
      const result = await this.elasticSearch.search({
        index: ROOMS_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    room_res_id: {
                      query: room_res_id,
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
                    room_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                }
              ]
            },
          },
          size: 1000,
        }
      })
      if (result.hits?.total === 0) {
        return []
      }
      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'getRoomByRestaurantId',
        class: 'RoomsQuery',
        function: 'getRoomByRestaurantId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
