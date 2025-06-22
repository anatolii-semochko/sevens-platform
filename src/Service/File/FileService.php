<?php

namespace App\Service\File;

use Exception;
use Imagick;
use ImagickException;

class FileService
{
    public const string FILE_DIR = '/app/public/uploads/';
    public const string MATERIALS = 'materials/';

//    /**
//     * @throws Exception
//     */
//    public function saveBlobImage(string $filePath, string $fileName, string $blob): string
//    {
//        $dir = rtrim(self::FILE_DIR . $filePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
//
//        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
//            throw new \RuntimeException("Couldn't create directory: $dir");
//        }
//
//        // Витягнути base64-дані з data:image/...
//        if (preg_match('/^data:image\/\w+;base64,/', $blob)) {
//            $blob = substr($blob, strpos($blob, ',') + 1);
//        } else {
//            throw new \InvalidArgumentException('Expected blob format data:image/*;base64,...');
//        }
//
//        $binaryData = base64_decode($blob);
//        if ($binaryData === false) {
//            throw new \RuntimeException('File decoding error base64');
//        }
//
//        try {
//            $image = new Imagick();
//            $image->readImageBlob($binaryData);
//            $image->setImageFormat('webp');
//            $image->setImageCompressionQuality(80);
//
//            // Якщо $fileName вже містить ".webp", не додавати ще раз
//            $savedFileName = str_ends_with($fileName, '.webp') ? $fileName : $fileName . '.webp';
//            $fullPath = $dir . $savedFileName;
//
//            if (!is_writable($dir)) {
//                throw new \RuntimeException("Directory {$dir} is not writable by PHP");
//            }
//
//            if (!$image->writeImage($fullPath)) {
//                throw new \RuntimeException("File saving error $fullPath");
//            }
//
//            $image->clear();
//            $image->clear();
//        } catch (ImagickException $e) {
//            throw new Exception($e->getMessage());       
//        }
//
//        return $savedFileName;
//    }
//
//    /**
//     * Remove the file with the path
//     * @throws Exception
//     */
//    public function delete(string $filePath, string $fileName): void
//    {
//        $fullPathFileName = rtrim(self::FILE_DIR . $filePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName;
//        if (is_file($fullPathFileName)) {
//            @unlink($fullPathFileName);
//        }
//        if (is_file($fullPathFileName)) {
//            throw new Exception("Can't delete file {$fullPathFileName}");
//        }
//    }
//
//    /**
//     * @throws Exception
//     */
//    public function saveResizedBlobImage(
//        string $filePath,
//        string $fileName,
//        string $blob,
//        int $maxWidth,
//        int $maxHeight,
//    ): string {
//        $dir = rtrim(self::FILE_DIR . $filePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
//
//        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
//            throw new \RuntimeException("Couldn't create directory: $dir");
//        }
//
//        if (preg_match('/^data:image\/\w+;base64,/', $blob)) {
//            $blob = substr($blob, strpos($blob, ',') + 1);
//        } else {
//            throw new \InvalidArgumentException('Expected blob format data:image/*;base64,...');
//        }
//
//        $binaryData = base64_decode($blob);
//        if ($binaryData === false) {
//            throw new \RuntimeException('File decoding error base64');
//        }
//
//        try {
//            $image = new Imagick();
//            $image->readImageBlob($binaryData);
//            $image->setImageFormat('webp');
//            $image->setImageCompressionQuality(80);
//
//            $image->thumbnailImage($maxWidth, $maxHeight, true); // зберігає пропорції
//
//            $fullPath = $dir . $fileName;
//
//            if (!is_writable($dir)) {
//                throw new \RuntimeException("Directory {$dir} is not writable by PHP");
//            }
//
//            if (!$image->writeImage($fullPath)) {
//                throw new \RuntimeException("File saving error $fullPath");
//            }
//
//            $image->clear();
//            $image->clear();
//        } catch (ImagickException $e) {
//            throw new Exception($e->getMessage());
//        }
//
//        return $fileName;
//    }
}
