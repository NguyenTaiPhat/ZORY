import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { validateCsrfOrigin } from '@/lib/csrf';

export async function POST(req: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(req);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: csrfCheck.reason || 'CSRF: Nguồn gốc yêu cầu không hợp lệ' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const customUrl = formData.get('url') as string | null;

    let finalCoverUrl = '';

    if (customUrl) {
      const trimmedUrl = customUrl.trim();
      // Chặn các URL scheme độc hại như javascript:, data:, vbscript:
      if (!/^https?:\/\//i.test(trimmedUrl) && !/^\/uploads\//i.test(trimmedUrl)) {
        return NextResponse.json(
          { error: 'Liên kết ảnh không hợp lệ. Chỉ chấp nhận giao thức http:// hoặc https://' },
          { status: 400 }
        );
      }
      finalCoverUrl = trimmedUrl;
    } else if (file) {
      // Giới hạn kích thước tệp tối đa 5MB
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB)' },
          { status: 400 }
        );
      }

      // Kiểm tra định dạng MIME khai báo
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (file.type && !allowedMimes.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { error: 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Kiểm tra chữ ký nhị phân thực tế (Magic Bytes)
      const isJpeg = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isWebp = buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer.toString('ascii', 8, 12) === 'WEBP';

      if (!isJpeg && !isPng && !isWebp) {
        return NextResponse.json(
          { error: 'Tệp tải lên không phải hình ảnh hợp lệ (chữ ký nhị phân magic bytes không khớp)' },
          { status: 400 }
        );
      }

      const ext = isJpeg ? '.jpg' : isPng ? '.png' : '.webp';

      const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');

      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, fileName), buffer);

      finalCoverUrl = `/uploads/covers/${fileName}`;
    } else {
      return NextResponse.json(
        { error: 'Vui lòng chọn tệp ảnh hoặc nhập liên kết ảnh' },
        { status: 400 }
      );
    }

    // Nếu có projectId, cập nhật đồng thời cho bản thảo và sách đã xuất bản
    if (projectId) {
      const project = await prisma.aiProject.findFirst({
        where: { id: projectId, userId: user.id },
      });

      if (project) {
        await prisma.aiProject.update({
          where: { id: projectId },
          data: { coverUrl: finalCoverUrl },
        });

        if (project.publishedBookId) {
          await prisma.book.update({
            where: { id: project.publishedBookId },
            data: { coverUrl: finalCoverUrl },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      coverUrl: finalCoverUrl,
    });
  } catch (error: any) {
    console.error('Lỗi tải ảnh bìa:', error);
    return NextResponse.json(
      { error: 'Lỗi tải ảnh bìa lên hệ thống' },
      { status: 500 }
    );
  }
}
