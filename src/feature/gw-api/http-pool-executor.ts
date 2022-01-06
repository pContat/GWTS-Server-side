import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import {
  bufferTime,
  concatMap,
  delay,
  filter,
  first,
  forkJoin,
  map,
  mergeAll,
  Observable,
  of,
  retry,
  share,
  Subject,
  tap,
} from 'rxjs';
import { ObservableFunction } from '../../common/utils';

@Injectable()
export class HTTPPoolExecutor {
  private readonly logger = new Logger(HTTPPoolExecutor.name);
  static requestId = 1;

  private pendingRequest: Subject<{
    id: number;
    callback: ObservableFunction;
  }>;

  readonly maxRequestPerSec = 4;

  public httpRequestPoolExecutor: Observable<{
    id: number;
    response: unknown;
  }>;

  constructor(private readonly httpService: HttpService) {
    this.pendingRequest = new Subject();

    const asObservable = this.pendingRequest.asObservable();

    this.httpRequestPoolExecutor = asObservable.pipe(
      tap((e) => this.logger.verbose(`incoming request: ${e.id} `)),
      // bufferCount(1), // Buffers the source Observable values until the size hits the maximum bufferSize given.
      bufferTime(1000, null, this.maxRequestPerSec), //Collect emitted values until provided time has passed,
      concatMap((data) => {
        const callArray = data.map((request) =>
          request
            .callback()
            .pipe(map((response) => ({ id: request.id, response }))),
        );
        return forkJoin([
          ...callArray,
          of({ id: -1, response: undefined }).pipe(delay(1000)), // force 1s min interval between batch request
        ]);
        // return of(data).pipe(delay(1000));
      }), //delay the one sec delay if request are too quick

      mergeAll(), //concatAll(), // or mergeAll() or concatAll() or switchMap( e => e) , in order to have only flatten the array of buffer
      filter((request) => request?.id !== -1), //clear the delay
      share(), // As long as there is at least one Subscriber this Observable will be subscribed and emitting data. When all subscribers have unsubscribed it will unsubscribe from the source Observable.
    );
    // allow to always have a subscriber
  }

  get<T>(url: string): Promise<T> {
    const requestId = HTTPPoolExecutor.requestId++;
    return new Promise((resolve, reject) => {
      const callback = () => {
        this.logger.verbose(
          `execute request: ${requestId} : ${url.substring(0, 80)}`,
        );
        return this.httpService.get(url).pipe(
          map((response) => response.data),
          retry(2),
          first(),
        );
      };

      // notify when response is ready
      this.httpRequestPoolExecutor
        .pipe(
          filter((el) => el.id === requestId),
          map((el) => el.response as T),
          tap(() =>
            this.logger.verbose(`notify response for request: ${requestId}`),
          ),
          first(),
        )
        .subscribe({
          next: (v) => {
            return resolve(v);
          },
          error: (e) => {
            this.logger.error(
              `error in notifier for request: ${requestId} : ${
                e?.response?.statusText || e?.message
              } `,
            );
            return reject(e);
          },
        });

      this.pendingRequest.next({ id: requestId, callback });
    });
  }
}
