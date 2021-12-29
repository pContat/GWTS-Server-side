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
import { ObservableFunction } from '../core/utils';

@Injectable()
export class HTTPPoolExecutor {
  private readonly logger = new Logger(HTTPPoolExecutor.name);
  static requestCount = 1; // used as id
  private readonly lang = 'fr';

  private pendingRequest: Subject<{
    id: number;
    callback: ObservableFunction;
  }>;

  readonly maxRequestPerSec = 2;

  public httpRequestPoolExecutor: Observable<{
    id: number;
    response: unknown;
  }>;

  constructor(private readonly httpService: HttpService) {
    this.pendingRequest = new Subject();

    const asObservable = this.pendingRequest.asObservable();

    this.httpRequestPoolExecutor = asObservable.pipe(
      tap(e => this.logger.debug(`incoming request: ${e.id} `)),
      // bufferCount(1), // Buffers the source Observable values until the size hits the maximum bufferSize given.
      bufferTime(1000, null, this.maxRequestPerSec), //Collect emitted values until provided time has passed,
      concatMap(data => {
        const callArray = data.map(request =>
          request
            .callback()
            .pipe(map(response => ({ id: request.id, response }))),
        );
        return forkJoin([
          ...callArray,
          of({ id: -1, response: undefined }).pipe(delay(1000)), // force 1s min interval between batch request
        ]);
        // return of(data).pipe(delay(1000));
      }), //delay the one sec delay if request are too quick

      mergeAll(), //concatAll(), // or mergeAll() or concatAll() or switchMap( e => e) , in order to have only flatten the array of buffer
      filter(request => request?.id !== -1), //clear the delay
      share(), // As long as there is at least one Subscriber this Observable will be subscribed and emitting data. When all subscribers have unsubscribed it will unsubscribe from the source Observable.
    );
    // allow to always have a subscriber
    // this.httpRequestPoolExecutor.subscribe(() => console.log('test'));
  }

  get<T>(url: string): Promise<T> {
    const requestId = HTTPPoolExecutor.requestCount++;
    return new Promise((resolve, reject) => {
      const callback = () => {
        this.logger.debug(
          `execute request: ${requestId} : ${url.substring(0, 60)}`,
        );
        return this.httpService.get(this.appendLangParam(url)).pipe(
          map(response => response.data),
          retry(2),
          first(),
        );
      };

      // notify when response is ready
      this.httpRequestPoolExecutor
        .pipe(
          filter(el => el.id === requestId),
          map(el => el.response as T),
          tap(() =>
            this.logger.debug(`notify response for request: ${requestId}`),
          ),
          first(),
        )
        .subscribe({
          next: v => {
            return resolve(v);
          },
          error: e => {
            this.logger.error(`error in notifier for request: ${requestId}`);
            console.error(e);
            return reject(e);
          },
        });

      this.pendingRequest.next({ id: requestId, callback });
    });
  }

  private appendLangParam(url: string) {
    const lastArg =
      url.indexOf('?') === -1 ? `?lang=${this.lang}` : `&lang=${this.lang}`;
    return url + lastArg;
  }
}