use anchor_lang::{
    prelude::*,
    solana_program::{
        program::invoke,
        instruction:: {
            Instruction
        },
    },
    system_program,
};

use anchor_spl::{
    token,
    associated_token,
};

use mpl_token_metadata::{
    instruction as mpl_instruction,
    ID as TOKEN_METADATA_ID
};

pub mod constant;
pub mod context;
pub mod state;

use crate::{
    constant::*,
    context::*,
    state::*,
};

declare_id!("4jec8qCRTawG5e1nEc1eTMpXNvyF3j3K8eoD6jTzYeoH");

#[derive(AnchorSerialize, AnchorDeserialize, Default)]
pub struct TransferTokenParams {
    pub instruction: u8,
    pub amount: u64,
}

#[repr(C)]
#[cfg_attr(feature = "serde-feature", derive(Serialize, Deserialize))]
#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone)]
/// Args for create call
pub struct CreateMetadataAccountArgsV3 {
    /// Note that unique metadatas are disabled for now.
    pub data: DataV2,
    /// Whether you want your metadata to be updateable in the future.
    pub is_mutable: bool,
}
#[derive(AnchorSerialize, AnchorDeserialize, PartialEq, Eq, Debug, Clone)]
pub struct DataV2 {
    /// The name of the asset
    pub name: String,
    /// The symbol for the asset
    pub symbol: String,
    /// URI pointing to JSON representing the asset
    pub uri: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
}


#[program]
pub mod mint_nft {
    use super::*;

    pub fn create_mint_account(ctx: Context<CreateMintAccountContext>) -> Result<()> {
        msg!("Creating mint account...");
        msg!("Mint: {}", &ctx.accounts.mint.key());
        system_program::create_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                system_program::CreateAccount {
                    from: ctx.accounts.mint_authority.to_account_info(),
                    to: ctx.accounts.mint.to_account_info(),
                },
            ),
            10000000,
            82,
            &ctx.accounts.token_program.key(),
        )?;
        Ok(())
    }

    pub fn initialize_mint(ctx: Context<InitializeMintContext>) -> Result<()> {
        msg!("Initializing mint account...");
        msg!("Mint: {}", &ctx.accounts.mint.key());
        token::initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: ctx.accounts.mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                }),
                0,
                &ctx.accounts.mint_authority.key(),
                Some(&ctx.accounts.mint_authority.key()),
        )
    }

    pub fn create_associated_token_account(ctx: Context<CreateAssociatedTokenAccountContext>) -> Result<()> {
        associated_token::create( 
            CpiContext::new(
                ctx.accounts.associated_token_program.to_account_info(), 
                associated_token::Create { 
                    payer: ctx.accounts.payer.to_account_info(), 
                    associated_token: ctx.accounts.associated_token.to_account_info(), 
                    authority: ctx.accounts.authority.to_account_info(), 
                    mint: ctx.accounts.mint.to_account_info(), 
                    system_program: ctx.accounts.system_program.to_account_info(), 
                    token_program: ctx.accounts.token_program.to_account_info(),
                }
            )
        )
    }

    pub fn mint_token(ctx: Context<MintToContext>, amount: u64) -> Result<()> {
        let payer = &ctx.accounts.payer;
        let mint = &ctx.accounts.mint;
        let token_account = &ctx.accounts.token_account;
        let authority = &ctx.accounts.authority;
        let token_program = &ctx.accounts.token_program;

        let data = TransferTokenParams {
            instruction: 7,
            amount,
        };

        msg!("Data {:?}", data.amount);

        let data = data.try_to_vec().unwrap();

        let instruction = Instruction {
            program_id: token_program.key(),
            accounts: vec![
                AccountMeta::new(mint.key(), true),
                AccountMeta::new(token_account.key(), false),
                AccountMeta::new(authority.key(), true),
            ],
            data,
        };

        msg!("DEBUG: MintTo Instruction {:?}", instruction);

        invoke(&instruction, &[
                payer.to_account_info(), 
                mint.to_account_info(), 
                token_account.to_account_info(), 
                authority.to_account_info()
            ])
        .expect("CPI failed");

        Ok(())
    }

    pub fn create_token_metadata_account(ctx: Context<CreateMetadataAccountsContext>, creators: Vec<Creator>, name: String, symbol: String, uri: String) -> Result<()> {
        let metadata_account = &ctx.accounts.metadata_account;
        let mint_authority = &ctx.accounts.mint_authority;
        let payer = &ctx.accounts.payer;
        let update_authority = &ctx.accounts.update_authority;
        let mint = &ctx.accounts.mint;
        let system_program = &ctx.accounts.system_program;
        let rent = &ctx.accounts.rent;
        let token_metadata_program = &ctx.accounts.token_metadata_program;
        let mut token_creators: Vec<mpl_token_metadata::state::Creator> = Vec::new();

        for creator in creators.iter() {
            token_creators.push(
                mpl_token_metadata::state::Creator {
                    address: creator.address,
                    verified: creator.verified,
                    share: creator.share,
                }
            )
        }

        let instruction = mpl_instruction::create_metadata_accounts_v3(
            TOKEN_METADATA_ID, 
            metadata_account.key(), 
            mint.key(), 
            mint_authority.key(), 
            payer.key(), 
            update_authority.key(), 
            name, 
            symbol, 
            uri, 
            Some(token_creators), 
            0, 
            true, 
            false, 
            None, 
            None,
            None,
        );
        msg!("DEBUG: create metadata {:?}", instruction);

        invoke(
            &instruction, 
            &[
                metadata_account.to_account_info(),
                mint.to_account_info(),
                mint_authority.to_account_info(),
                payer.to_account_info(),
                update_authority.to_account_info(),
                system_program.to_account_info(),
                rent.to_account_info(),
                token_metadata_program.to_account_info(),
            ])
        .expect("CPI failed");
        Ok(())
    }

    pub fn create_master_edition_account(ctx: Context<CreateMasterEditionAccountContext>, max_supply: u64) -> Result<()> {
        let metadata_account = &ctx.accounts.metadata_account;
        let mint_authority = &ctx.accounts.mint_authority;
        let payer = &ctx.accounts.payer;
        let update_authority = &ctx.accounts.update_authority;
        let mint = &ctx.accounts.mint;
        let system_program = &ctx.accounts.system_program;
        let rent = &ctx.accounts.rent;
        let token_metadata_program = &ctx.accounts.token_metadata_program;
        let master_edition_account = &ctx.accounts.master_edition_account;
        let token_program = &ctx.accounts.token_program;

        let instruction = mpl_instruction::create_master_edition_v3(
            TOKEN_METADATA_ID, 
            master_edition_account.key(), 
            mint.key(), 
            update_authority.key(), 
            mint_authority.key(), 
            metadata_account.key(), 
            payer.key(), 
            Some(max_supply),
        );

        msg!("DEBUG: Create master edition instruction {:?}", instruction);

        invoke(&instruction, &[
            metadata_account.to_account_info(),
            mint.to_account_info(),
            mint_authority.to_account_info(),
            payer.to_account_info(),
            update_authority.to_account_info(),
            system_program.to_account_info(),
            rent.to_account_info(),
            token_metadata_program.to_account_info(),
            master_edition_account.to_account_info(),
            token_program.to_account_info(),
        ])
        .expect("CPI failed");

        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_edition_account(ctx: Context<CreatePrintEditionContext>, edition: u64) -> Result<()> {
        let edition_metadata_account = &ctx.accounts.edition_metadata_account;
        let edition_account = &ctx.accounts.edition_account;
        let master_edition_account = &ctx.accounts.master_edition_account;
        let edition_mint = &ctx.accounts.edition_mint;
        let edition_mark_pda = &ctx.accounts.edition_mark_pda;
        let edition_mint_authority = &ctx.accounts.edition_mint_authority;
        let payer = &ctx.accounts.payer;
        let token_account_owner = &ctx.accounts.token_account_owner;
        let token_account = &ctx.accounts.token_account;
        let edition_update_authority = &ctx.accounts.edition_update_authority;
        let metadata_account = &ctx.accounts.metadata_account;
        let metadata_mint = &ctx.accounts.metadata_mint;
        let token_program = &ctx.accounts.token_program;
        let system_program = &ctx.accounts.system_program;
        let token_metadata_program = &ctx.accounts.token_metadata_program;
        let rent = &ctx.accounts.rent;

        let instruction = mpl_token_metadata::instruction::mint_new_edition_from_master_edition_via_token(
            TOKEN_METADATA_ID,
            edition_metadata_account.key(),
            edition_account.key(), 
            master_edition_account.key(), 
            edition_mint.key(), 
            edition_mint_authority.key(),
            payer.key(), 
            token_account_owner.key(), 
            token_account.key(), 
            edition_update_authority.key(), 
            metadata_account.key(),
            metadata_mint.key(), 
            edition
        );

        msg!("DEBUG: Create edition instruction {:?}", instruction.accounts[4]);

        invoke(&instruction, &[
            edition_metadata_account.to_account_info(),
            edition_account.to_account_info(),
            master_edition_account.to_account_info(),
            edition_mint.to_account_info(),
            edition_mark_pda.to_account_info(),
            edition_mint_authority.to_account_info(),
            payer.to_account_info(),
            token_account_owner.to_account_info(),
            token_account.to_account_info(),
            edition_update_authority.to_account_info(),
            metadata_account.to_account_info(),
            metadata_mint.to_account_info(),
            token_program.to_account_info(),
            system_program.to_account_info(),
            token_metadata_program.to_account_info(),
            rent.to_account_info(),
        ]).expect("CPI failed");

        Ok(())
    }

    // pub fn calculate_mark_pda(ctx)

}

