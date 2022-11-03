import { SentryCliPluginOptions } from '@sentry/webpack-plugin';
import { WebpackPluginInstance } from 'webpack';

export type SentryWebpackPluginOptions = SentryCliPluginOptions;
export type SentryWebpackPlugin = WebpackPluginInstance & { options: SentryWebpackPluginOptions };

/**
 * Overall Nextjs config
 */

// The first argument to `withSentryConfig` (which is the user's next config) may contain a `sentry` key, which we'll
// remove once we've captured it, in order to prevent nextjs from throwing warnings. Since it's only in there
// temporarily, we don't include it in the main `NextConfigObject` or `NextConfigFunction` types.
export type ExportedNextConfig = NextConfigObjectWithSentry | NextConfigFunctionWithSentry;

export type NextConfigObjectWithSentry = NextConfigObject & {
  sentry?: UserSentryOptions;
};
export type NextConfigFunctionWithSentry = (
  phase: string,
  defaults: { defaultConfig: NextConfigObject },
) => NextConfigObjectWithSentry;

export type NextConfigObject = {
  // Custom webpack options
  webpack?: WebpackConfigFunction | null;
  // Whether to build serverless functions for all pages, not just API routes. Removed in nextjs 12+.
  target?: 'server' | 'experimental-serverless-trace';
  // The output directory for the built app (defaults to ".next")
  distDir?: string;
  // The root at which the nextjs app will be served (defaults to "/")
  basePath?: string;
  // The root at which nextjs assets will be served (defaults to "/")
  assetPrefix?: string;
  // Config which will be available at runtime
  publicRuntimeConfig?: { [key: string]: unknown };
  // File extensions that count as pages in the `pages/` directory
  pageExtensions?: string[];
};

export type UserSentryOptions = {
  // Override the SDK's default decision about whether or not to enable to the webpack plugin. Note that `false` forces
  // the plugin to be enabled, even in situations where it's not recommended.
  disableServerWebpackPlugin?: boolean;
  disableClientWebpackPlugin?: boolean;

  // Use `hidden-source-map` for webpack `devtool` option, which strips the `sourceMappingURL` from the bottom of built
  // JS files
  hideSourceMaps?: boolean;

  // Force webpack to apply the same transpilation rules to the SDK code as apply to user code. Helpful when targeting
  // older browsers which don't support ES6 (or ES6+ features like object spread).
  transpileClientSDK?: boolean;

  // Upload files from `<distDir>/static/chunks` rather than `<distDir>/static/chunks/pages`. Usually files outside of
  // `pages/` only contain third-party code, but in cases where they contain user code, restricting the webpack
  // plugin's upload breaks sourcemaps for those user-code-containing files, because it keeps them from being
  // uploaded. At the same time, we don't want to widen the scope if we don't have to, because we're guaranteed to end
  // up uploading too many files, which is why this defaults to `false`.
  widenClientFileUpload?: boolean;

  // Automatically instrument Next.js data fetching methods and Next.js API routes
  autoInstrumentServerFunctions?: boolean;
};

export type NextConfigFunction = (phase: string, defaults: { defaultConfig: NextConfigObject }) => NextConfigObject;

/**
 * Webpack config
 */

// The two possible formats for providing custom webpack config in `next.config.js`
export type WebpackConfigFunction = (config: WebpackConfigObject, options: BuildContext) => WebpackConfigObject;
export type WebpackConfigObject = {
  devtool?: string;
  plugins?: Array<WebpackPluginInstance | SentryWebpackPlugin>;
  entry: WebpackEntryProperty;
  output: { filename: string; path: string };
  target: string;
  context: string;
  resolve?: {
    alias?: { [key: string]: string | boolean };
  };
  module?: {
    rules: Array<WebpackModuleRule>;
  };
} & {
  // Other webpack options
  [key: string]: unknown;
};

// Information about the current build environment
export type BuildContext = {
  dev: boolean;
  isServer: boolean;
  buildId: string;
  dir: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  webpack: { version: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultLoaders: any;
  totalPages: number;
  nextRuntime?: 'nodejs' | 'edge';
};

/**
 * Webpack `entry` config
 */

// For our purposes, the value for `entry` is either an object, or an async function which returns such an object
export type WebpackEntryProperty = EntryPropertyObject | EntryPropertyFunction;

export type EntryPropertyObject = {
  [key: string]: EntryPointValue;
};

export type EntryPropertyFunction = () => Promise<EntryPropertyObject>;

// Each value in that object is either a string representing a single entry point, an array of such strings, or an
// object containing either of those, along with other configuration options. In that third case, the entry point(s) are
// listed under the key `import`.
export type EntryPointValue = string | Array<string> | EntryPointObject;
export type EntryPointObject = { import: string | Array<string> };

/**
 * Webpack `module.rules` entry
 */

export type WebpackModuleRule = {
  test?: string | RegExp;
  include?: Array<string | RegExp> | RegExp;
  exclude?: (filepath: string) => boolean;
  use?: ModuleRuleUseProperty | Array<ModuleRuleUseProperty>;
  oneOf?: Array<WebpackModuleRule>;
};

export type ModuleRuleUseProperty = {
  loader?: string;
  options?: Record<string, unknown>;
};
