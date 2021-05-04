import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchemaType } from 'mongoose';

export type ImageMetadataDocument = ImageMetadata & Document;

@Schema()
export class ImageMetadata {
  @Prop()
  id: number;
  /** Number value of the EXIF Orientation header, if present */
  @Prop()
  orientation?: number;

  /** Name of decoder used to decompress image data e.g. jpeg, png, webp, gif, svg */
  @Prop()
  format?: string;

  /** Total size of image in bytes, for Stream and Buffer input only */
  @Prop()
  size?: number;

  /** Number of pixels wide (EXIF orientation is not taken into consideration) */
  @Prop()
  width?: number;

  /** Number of pixels high (EXIF orientation is not taken into consideration) */
  @Prop()
  height?: number;

  /** Name of colour space interpretation */
  @Prop()
  space?: string;

  /** Number of bands e.g. 3 for sRGB, 4 for CMYK */
  @Prop()
  channels?: number;

  /** Name of pixel depth format e.g. uchar, char, ushort, float ... */
  @Prop()
  depth?: string;

  /** Number of pixels per inch (DPI), if present */
  @Prop()
  density?: number;

  /** String containing JPEG chroma subsampling, 4:2:0 or 4:4:4 for RGB, 4:2:0:4 or 4:4:4:4 for CMYK */
  @Prop()
  chromaSubsampling: string;

  /** Boolean indicating whether the image is interlaced using a progressive scan */
  @Prop()
  isProgressive?: boolean;

  /** Number of pages/frames contained within the image, with support for TIFF, HEIF, PDF, animated GIF and animated WebP */
  @Prop()
  pages?: number;

  /** Number of pixels high each page in a multi-page image will be. */
  @Prop()
  pageHeight?: number;

  /** Number of times to loop an animated image, zero refers to a continuous loop. */
  @Prop()
  loop?: number;

  /** Delay in ms between each page in an animated image, provided as an array of integers. */
  @Prop()
  delay?: number[];

  /**  Number of the primary page in a HEIF image */
  @Prop()
  pagePrimary?: number;

  /** Boolean indicating the presence of an embedded ICC profile */
  @Prop()
  hasProfile?: boolean;

  /** Boolean indicating the presence of an alpha transparency channel */
  @Prop()
  hasAlpha?: boolean;

  /** Buffer containing raw EXIF data, if present */
  @Prop({ type: SchemaType.Types.Mixed })
  exif?: any;

  /** Buffer containing raw ICC profile data, if present */
  @Prop({ type: SchemaType.Types.Mixed })
  icc?: any;

  /** Buffer containing raw IPTC data, if present */
  @Prop({ type: SchemaType.Types.Mixed })
  iptc?: any;

  /** Buffer containing raw XMP data, if present */
  @Prop({ type: SchemaType.Types.Mixed })
  xmp?: any;

  /** Buffer containing raw TIFFTAG_PHOTOSHOP data, if present */
  //   @Prop({type: Buffer})
  //   tifftagPhotoshop?: Buffer;
}

export const ImageMetadataSchema = SchemaFactory.createForClass(ImageMetadata);
