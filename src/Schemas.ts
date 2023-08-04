/**
 * Schemas.
 *
 * @since 1.0.0
 */
import * as Schema from "@effect/schema/Schema";

const _FormData = Schema.instanceOf(FormData);

export {
  /**
   * FormData schema
   *
   * @category schemas
   * @since 1.0.0
   */
  _FormData as FormData,
};
