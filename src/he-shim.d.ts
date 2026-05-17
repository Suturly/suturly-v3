declare module 'he' {
  interface He {
    decode(html: string): string
  }
  const he: He
  export default he
}
