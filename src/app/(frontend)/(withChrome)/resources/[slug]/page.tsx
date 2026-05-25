import PostPage, { generateMetadata as generatePostMetadata } from '../../posts/[slug]/page'

export default PostPage
export const generateMetadata = generatePostMetadata
export const revalidate = 600
