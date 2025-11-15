import { fulfillImgGenBasic } from './img-gen-basic';
import { fulfillMemeMaker } from './meme-maker';
import { fulfillBgRemove } from './bg-remove';
import { fulfillUpscale2x } from './upscale-2x';
import { fulfillFavicon } from './favicon';
import { fulfillUrlsum } from './urlsum';
import { fulfillPdf2txt } from './pdf2txt';

export async function fulfillSku(
  skuId: string,
  input: any,
  txSig: string,
  model?: string
): Promise<any> {
  switch (skuId) {
    case 'img-gen-basic':
      return fulfillImgGenBasic(input, txSig, model);
    
    case 'meme-maker':
      return fulfillMemeMaker(input, txSig, model);
    
    case 'bg-remove':
      return fulfillBgRemove(input, txSig, model);
    
    case 'upscale-2x':
      return fulfillUpscale2x(input, txSig);
    
    case 'favicon':
      return fulfillFavicon(input, txSig);
    
    case 'urlsum':
      return fulfillUrlsum(input, model);
    
    case 'pdf2txt':
      return fulfillPdf2txt(input, txSig);
    
    default:
      throw new Error(`Unknown SKU: ${skuId}`);
  }
}

