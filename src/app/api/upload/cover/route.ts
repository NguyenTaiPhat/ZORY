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
      // Chấp nhận http://, https://, /uploads/, và data:image/
      if (
        !/^https?:\/\//i.test(trimmedUrl) &&
        !/^\/uploads\//i.test(trimmedUrl) &&
        !/^data:image\//i.test(trimmedUrl)
      ) {
        return NextResponse.json(
          { error: 'Liên kết ảnh không hợp lệ. Chỉ chấp nhận giao thức http://, https:// hoặc định dạng ảnh trực tiếp' },
          { status: 400 }
        );
      }
      finalCoverUrl = trimmedUrl;
    } else if (file) {
      // Giới hạn kích thước tệp tối đa 15MB
      const MAX_FILE_SIZE = 15 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 15MB)' },
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
      const mimeType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp';
      const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;

      // Thử lưu vào filesystem nếu môi trường hỗ trợ (local development)
      let savedToDisk = false;
      if (!process.env.VERCEL) {
        try {
          const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
          await fs.mkdir(uploadDir, { recursive: true });
          await fs.writeFile(path.join(uploadDir, fileName), buffer);
          finalCoverUrl = `/uploads/covers/${fileName}`;
          savedToDisk = true;
        } catch (fsErr) {
          console.warn('Không thể ghi file vào disk (chuyển sang base64 data URL):', fsErr);
        }
      }

      if (!savedToDisk) {
        finalCoverUrl = base64Url;
      }
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

        let targetBookId = project.publishedBookId;
        if (!targetBookId) {
          const existingBook = await prisma.book.findFirst({
            where: {
              authorId: user.id,
              title: project.title,
            },
            select: { id: true },
          });
          if (existingBook) {
            targetBookId = existingBook.id;
          }
        }

        if (targetBookId) {
          await prisma.book.update({
            where: { id: targetBookId },
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
      { error: error?.message || 'Lỗi tải ảnh bìa lên hệ thống' },
      { status: 500 }
    );
  }
}
