import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let args = CommandLine.arguments
let pdfURL = URL(fileURLWithPath: args[1]); let outDir = args[2]; let scale: CGFloat = 1.6
guard let doc = CGPDFDocument(pdfURL as CFURL) else { print("no doc"); exit(1) }
for i in 1...doc.numberOfPages {
  guard let page = doc.page(at: i) else { continue }
  let r = page.getBoxRect(.mediaBox)
  let w = Int(r.width*scale), h = Int(r.height*scale)
  let cs = CGColorSpaceCreateDeviceRGB()
  guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w*4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { continue }
  ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.scaleBy(x: scale, y: scale); ctx.drawPDFPage(page)
  let img = ctx.makeImage()!
  let url = URL(fileURLWithPath: String(format: "%@/page-%02d.png", outDir, i)) as CFURL
  let dest = CGImageDestinationCreateWithURL(url, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, img, nil); CGImageDestinationFinalize(dest)
}
print("rendered \(doc.numberOfPages) pages")
