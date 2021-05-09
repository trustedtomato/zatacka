export const loadSvg = async (url: string): Promise<SVGElement> => {
  const response = await fetch(url)
  const responseText = await response.text()
  const div = document.createElement('div')
  div.innerHTML = responseText
  return div.querySelector('svg')
}