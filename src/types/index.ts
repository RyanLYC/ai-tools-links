export interface Website {
  id?: number;
  name: string;
  url: string;
  // 图标二进制内容；导入的数据可能无图标，故为可选
  icon?: ArrayBuffer;
  iconMimeType: string;
  description: string;
  apiKeys: string[];
  categoryIds: number[];
  tagIds: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  iconName: string;
}

export interface Tag {
  id?: number;
  name: string;
  count: number;
}

export interface FilterState {
  categoryId: number | null;
  tagIds: number[];
  searchQuery: string;
}
