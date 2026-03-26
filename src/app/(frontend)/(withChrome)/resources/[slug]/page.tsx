import PostPage, {
  generateMetadata as generatePostMetadata,
  generateStaticParams as generatePostStaticParams,
} from '../../posts/[slug]/page'

export default PostPage
export const generateMetadata = generatePostMetadata
export const generateStaticParams = generatePostStaticParams
