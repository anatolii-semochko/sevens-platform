<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250711173250 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE admin_users (id VARCHAR(36) NOT NULL, active TINYINT(1) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, full_name VARCHAR(64) NOT NULL, avatar VARCHAR(255) DEFAULT NULL, roles JSON NOT NULL, UNIQUE INDEX uniq_admin_user_email (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE categories (id VARCHAR(36) NOT NULL, main_parent_id VARCHAR(36) DEFAULT NULL, activity_parent_id VARCHAR(36) DEFAULT NULL, active INT UNSIGNED DEFAULT 0 NOT NULL, `order` INT UNSIGNED NOT NULL, level SMALLINT UNSIGNED NOT NULL, name VARCHAR(64) NOT NULL, url VARCHAR(32) DEFAULT NULL, logo VARCHAR(64) DEFAULT NULL, parents VARCHAR(1024) DEFAULT NULL, children LONGTEXT DEFAULT NULL, children_inside LONGTEXT DEFAULT NULL, path LONGTEXT DEFAULT NULL, parent_id VARCHAR(36) DEFAULT NULL, INDEX IDX_3AF34668727ACA70 (parent_id), UNIQUE INDEX `unique` (name, parent_id), UNIQUE INDEX url_activity_unique (activity_parent_id, url), UNIQUE INDEX url_main_unique (main_parent_id, url), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE categories_lang (id VARCHAR(36) NOT NULL, name VARCHAR(64) NOT NULL, title VARCHAR(64) NOT NULL, logo_alt LONGTEXT DEFAULT NULL, short_description LONGTEXT NOT NULL, description LONGTEXT NOT NULL, category_id VARCHAR(36) NOT NULL, language_id VARCHAR(36) NOT NULL, INDEX IDX_E93ADCE412469DE2 (category_id), INDEX IDX_E93ADCE482F1BAF4 (language_id), UNIQUE INDEX fk_categories_lang_unique (category_id, language_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE help (id VARCHAR(36) NOT NULL, parent_id VARCHAR(36) DEFAULT NULL, `order` INT UNSIGNED NOT NULL, level SMALLINT UNSIGNED NOT NULL, name VARCHAR(36) NOT NULL, url VARCHAR(255) DEFAULT NULL, parents VARCHAR(1024) DEFAULT NULL, children LONGTEXT DEFAULT NULL, children_inside LONGTEXT DEFAULT NULL, path LONGTEXT DEFAULT NULL, UNIQUE INDEX UNIQ_8875CAC5E237E06 (name), UNIQUE INDEX UNIQ_8875CACF47645AE (url), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE help_content (id VARCHAR(36) NOT NULL, title VARCHAR(70) DEFAULT NULL, seo_keywords VARCHAR(255) DEFAULT NULL, seo_description VARCHAR(160) DEFAULT NULL, short_description LONGTEXT DEFAULT NULL, description LONGTEXT DEFAULT NULL, help_id VARCHAR(36) NOT NULL, language_id VARCHAR(36) NOT NULL, INDEX IDX_A0DFCF75D3F165E7 (help_id), INDEX IDX_A0DFCF7582F1BAF4 (language_id), UNIQUE INDEX `unique` (help_id, language_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE languages (id VARCHAR(36) NOT NULL, code VARCHAR(2) NOT NULL, name VARCHAR(16) NOT NULL, `order` INT NOT NULL, active TINYINT(1) NOT NULL, main TINYINT(1) NOT NULL, UNIQUE INDEX UNIQ_A0D1537977153098 (code), UNIQUE INDEX UNIQ_A0D153795E237E06 (name), UNIQUE INDEX UNIQ_A0D15379C6898E08 (`order`), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE materials (token VARCHAR(44) NOT NULL, title VARCHAR(64) NOT NULL, logo VARCHAR(64) NOT NULL, description LONGTEXT NOT NULL, PRIMARY KEY(token)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE pages (id VARCHAR(36) NOT NULL, url VARCHAR(64) NOT NULL, terms VARCHAR(128) NOT NULL, UNIQUE INDEX UNIQ_2074E575F47645AE (url), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE pages_content (id VARCHAR(36) NOT NULL, term VARCHAR(64) NOT NULL, page_id VARCHAR(36) DEFAULT NULL, INDEX IDX_6ED7A743C4663E4 (page_id), UNIQUE INDEX `unique` (term, page_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE pages_content_translations (id VARCHAR(36) NOT NULL, translation LONGTEXT DEFAULT NULL, page_content_id VARCHAR(36) NOT NULL, language_id VARCHAR(36) NOT NULL, INDEX IDX_798FD1278F409273 (page_content_id), INDEX IDX_798FD12782F1BAF4 (language_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE pages_seo (id VARCHAR(36) NOT NULL, breadcrumbs VARCHAR(100) DEFAULT NULL, title VARCHAR(70) DEFAULT NULL, keywords VARCHAR(255) DEFAULT NULL, description VARCHAR(160) DEFAULT NULL, page_id VARCHAR(36) NOT NULL, language_id VARCHAR(36) NOT NULL, INDEX IDX_A2EF2B15C4663E4 (page_id), INDEX IDX_A2EF2B1582F1BAF4 (language_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE categories ADD CONSTRAINT FK_3AF34668727ACA70 FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE categories_lang ADD CONSTRAINT FK_E93ADCE412469DE2 FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE categories_lang ADD CONSTRAINT FK_E93ADCE482F1BAF4 FOREIGN KEY (language_id) REFERENCES languages (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE help_content ADD CONSTRAINT FK_A0DFCF75D3F165E7 FOREIGN KEY (help_id) REFERENCES help (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE help_content ADD CONSTRAINT FK_A0DFCF7582F1BAF4 FOREIGN KEY (language_id) REFERENCES languages (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_content ADD CONSTRAINT FK_6ED7A743C4663E4 FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_content_translations ADD CONSTRAINT FK_798FD1278F409273 FOREIGN KEY (page_content_id) REFERENCES pages_content (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_content_translations ADD CONSTRAINT FK_798FD12782F1BAF4 FOREIGN KEY (language_id) REFERENCES languages (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_seo ADD CONSTRAINT FK_A2EF2B15C4663E4 FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_seo ADD CONSTRAINT FK_A2EF2B1582F1BAF4 FOREIGN KEY (language_id) REFERENCES languages (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE categories DROP FOREIGN KEY FK_3AF34668727ACA70
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE categories_lang DROP FOREIGN KEY FK_E93ADCE412469DE2
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE categories_lang DROP FOREIGN KEY FK_E93ADCE482F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE help_content DROP FOREIGN KEY FK_A0DFCF75D3F165E7
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE help_content DROP FOREIGN KEY FK_A0DFCF7582F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_content DROP FOREIGN KEY FK_6ED7A743C4663E4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_content_translations DROP FOREIGN KEY FK_798FD1278F409273
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_content_translations DROP FOREIGN KEY FK_798FD12782F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_seo DROP FOREIGN KEY FK_A2EF2B15C4663E4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pages_seo DROP FOREIGN KEY FK_A2EF2B1582F1BAF4
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE admin_users
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE categories
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE categories_lang
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE help
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE help_content
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE languages
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE materials
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE pages
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE pages_content
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE pages_content_translations
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE pages_seo
        SQL);
    }
}
